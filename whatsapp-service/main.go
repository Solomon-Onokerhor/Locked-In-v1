package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "modernc.org/sqlite"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"github.com/mdp/qrterminal/v3"
)

var client *whatsmeow.Client
var currentQR string

func connectWithRetry(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		if client.Store.ID == nil {
			// Not logged in — show QR
			qrChan, _ := client.GetQRChannel(ctx)
			err := client.Connect()
			if err != nil {
				fmt.Printf("Failed to connect: %v — retrying in 10s\n", err)
				time.Sleep(10 * time.Second)
				continue
			}
			for evt := range qrChan {
				if evt.Event == "code" {
					currentQR = evt.Code
					qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
					fmt.Println("Scan the QR code above to login. Or go to http://localhost:8081/api/qr in your browser.")
				} else {
					fmt.Println("Login event:", evt.Event)
				}
			}
		} else {
			err := client.Connect()
			if err != nil {
				fmt.Printf("Connect error: %v — retrying in 10s\n", err)
				time.Sleep(10 * time.Second)
				continue
			}
			fmt.Println("Connected to WhatsApp!")
		}
		return
	}
}

func main() {
	// Determine store path
	storePath := os.Getenv("STORE_PATH")
	if storePath == "" {
		storePath = "file:store.db?_foreign_keys=on&_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"
	} else {
		storePath = "file:" + storePath + "?_foreign_keys=on&_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"
	}

	// Log API key status
	if os.Getenv("WHATSAPP_API_KEY") == "" {
		fmt.Println("WARNING: WHATSAPP_API_KEY not set, using default 'development-key'")
	} else {
		fmt.Println("API key loaded from environment.")
	}

	dbLog := waLog.Stdout("Database", "DEBUG", true)
	container, err := sqlstore.New(context.Background(), "sqlite", storePath, dbLog)
	if err != nil {
		panic(err)
	}

	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		panic(err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client = whatsmeow.NewClient(deviceStore, clientLog)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// ── Auto-reconnect on disconnect ──────────────────────────────
	client.AddEventHandler(func(evt interface{}) {
		switch evt.(type) {
		case *events.Disconnected:
			fmt.Println("WhatsApp disconnected. Reconnecting in 5s...")
			time.Sleep(5 * time.Second)
			go connectWithRetry(ctx)
		case *events.LoggedOut:
			fmt.Println("WhatsApp session logged out. Manual QR scan required.")
		case *events.Connected:
			fmt.Println("WhatsApp connection established.")
			// Send presence immediately on connect so WA knows we're online
			_ = client.SendPresence(ctx, types.PresenceAvailable)
		}
	})

	// Initial connect
	connectWithRetry(ctx)

	// Set push name
	if deviceStore.PushName != "Locked In" {
		deviceStore.PushName = "Locked In"
		if err := deviceStore.Save(context.Background()); err != nil {
			fmt.Printf("Failed to save push name: %v\n", err)
		} else {
			fmt.Println("Push name set to 'Locked In'")
		}
	}

	// ── Keep-alive: send presence every 20 minutes ────────────────
	go func() {
		ticker := time.NewTicker(20 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if client.IsConnected() {
					_ = client.SendPresence(ctx, types.PresenceAvailable)
					fmt.Println("Keep-alive: presence sent.")
				} else {
					fmt.Println("Keep-alive: not connected, skipping presence.")
				}
			}
		}
	}()

	// ── Reminders Cron: Ping the Next.js API every 5 minutes ────────────────
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if client.IsConnected() {
					// Build the API URL (use env var or fallback to local dev)
					apiURL := os.Getenv("NEXT_PUBLIC_APP_URL")
					if apiURL == "" {
						apiURL = "http://localhost:3000"
					}
					cronEndpoint := fmt.Sprintf("%s/api/cron/reminders", apiURL)
					
					// If using a CRON_SECRET, you can add it to the request header
					req, err := http.NewRequest("GET", cronEndpoint, nil)
					if err != nil {
						fmt.Println("Cron setup failed:", err)
						continue
					}
					
					cronSecret := os.Getenv("CRON_SECRET")
					if cronSecret != "" {
						req.Header.Set("Authorization", "Bearer "+cronSecret)
					}

					resp, err := http.DefaultClient.Do(req)
					if err != nil {
						fmt.Println("Cron ping failed:", err)
					} else {
						fmt.Println("Cron ping triggered successfully, status:", resp.StatusCode)
						resp.Body.Close()
					}
				}
			}
		}
	}()

	// ── HTTP server ───────────────────────────────────────────────
	http.HandleFunc("/api/send", handleSendMessage)
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if client != nil && client.IsConnected() {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok","connected":true}`))
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte(`{"status":"degraded","connected":false}`))
		}
	})
	http.HandleFunc("/api/qr", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		if client != nil && client.IsConnected() {
			w.Write([]byte(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;"><h1 style="color:green">✅ Connected to WhatsApp!</h1></body></html>`))
			return
		}
		if currentQR == "" {
			w.Write([]byte(`<html><head><meta http-equiv="refresh" content="3"></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;"><h2>Loading QR code... please wait</h2></body></html>`))
			return
		}
		// Use Google Charts API to render the QR as a plain image — no JS required
		qrImageURL := fmt.Sprintf(
			"https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=%s&choe=UTF-8",
			currentQR,
		)
		html := fmt.Sprintf(`
			<html>
			<head><meta http-equiv="refresh" content="10"></head>
			<body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;gap:16px;">
				<h2 style="margin:0">Scan with WhatsApp</h2>
				<p style="margin:0;color:#555">Settings &gt; Linked Devices &gt; Link a Device</p>
				<div style="background:white;padding:20px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
					<img src="%s" width="300" height="300" alt="WhatsApp QR Code" />
				</div>
				<p style="color:#999;font-size:13px;">This page refreshes automatically every 10 seconds</p>
			</body>
			</html>
		`, qrImageURL)
		w.Write([]byte(html))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("HTTP Server running on :%s\n", port)
	go func() {
		if err := http.ListenAndServe(":"+port, nil); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for shutdown signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	fmt.Println("Shutting down gracefully...")
	client.Disconnect()
}
