package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	_ "modernc.org/sqlite"
	"github.com/mdp/qrterminal/v3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

var cli *whatsmeow.Client

func main() {
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	// Use modernc.org/sqlite which doesn't require CGO
	ctx := context.Background()
	container, err := sqlstore.New(ctx, "sqlite", "file:examplestore.db?_pragma=foreign_keys(1)", dbLog)
	if err != nil {
		panic(err)
	}
	
	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		panic(err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	cli = whatsmeow.NewClient(deviceStore, clientLog)
	cli.AddEventHandler(eventHandler)

	if cli.Store.ID == nil {
		// No ID stored, new login
		qrChan, _ := cli.GetQRChannel(context.Background())
		err = cli.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
				fmt.Println("Scan the QR code above to link your device.")
			} else {
				fmt.Println("Login event:", evt.Event)
			}
		}
	} else {
		// Already logged in, just connect
		err = cli.Connect()
		if err != nil {
			panic(err)
		}
	}

	// Start the API server for the Python backend to send messages
	go startAPIServer()

	// Listen to Ctrl+C to disconnect cleanly
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	cli.Disconnect()
}
