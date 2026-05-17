package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
	waProto "go.mau.fi/whatsmeow/binary/proto"
)

type SendMessageRequest struct {
	Recipient string `json:"recipient"` // e.g. "1234567890"
	Text      string `json:"text"`
}

func startAPIServer() {
	http.HandleFunc("/send", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SendMessageRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		jid, err := types.ParseJID(req.Recipient)
		if err != nil || jid.User == "" {
			jid = types.NewJID(req.Recipient, types.DefaultUserServer)
		}
		
		msg := &waProto.Message{
			Conversation: proto.String(req.Text),
		}

		// Wait to send message. Note: using context.Background() instead of r.Context() so it doesn't cancel if the HTTP client disconnects.
		_, err = cli.SendMessage(context.Background(), jid, msg)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Message sent successfully")
	})

	http.HandleFunc("/typing", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SendMessageRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		jid, err := types.ParseJID(req.Recipient)
		if err != nil || jid.User == "" {
			jid = types.NewJID(req.Recipient, types.DefaultUserServer)
		}

		_ = cli.SendChatPresence(context.Background(), jid, types.ChatPresenceComposing, types.ChatPresenceMediaText)
		w.WriteHeader(http.StatusOK)
	})

	fmt.Println("Starting Connector API Server on :3000")
	if err := http.ListenAndServe(":3000", nil); err != nil {
		fmt.Println("API Server error:", err)
	}
}
