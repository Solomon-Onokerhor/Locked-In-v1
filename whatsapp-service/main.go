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
					qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
					fmt.Println("Scan the QR code above to login.")
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
