package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"go.mau.fi/whatsmeow/types"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"google.golang.org/protobuf/proto"
)

type SendRequest struct {
	PhoneNumber string `json:"phone_number"`
	MessageText string `json:"message_text"`
	APIKey      string `json:"api_key"`
}

type SendResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, SendResponse{Success: false, Error: "Invalid JSON body"})
		return
	}

	// Validate API key against environment variable
	expectedKey := os.Getenv("WHATSAPP_API_KEY")
	if expectedKey == "" {
		expectedKey = "development-key" // fallback for local dev without env var
	}
	if req.APIKey != expectedKey {
		sendJSONResponse(w, http.StatusUnauthorized, SendResponse{Success: false, Error: "Invalid API Key"})
		return
	}

	if req.PhoneNumber == "" || req.MessageText == "" {
		sendJSONResponse(w, http.StatusBadRequest, SendResponse{Success: false, Error: "Missing phone_number or message_text"})
		return
	}

	if client == nil || !client.IsConnected() {
		sendJSONResponse(w, http.StatusInternalServerError, SendResponse{Success: false, Error: "WhatsApp client is not connected"})
		return
	}

	// Format phone number — WhatsApp JIDs look like 1234567890@s.whatsapp.net
	phone := strings.TrimLeft(req.PhoneNumber, "+")
	jid := types.JID{
		User:   phone,
		Server: types.DefaultUserServer,
	}

	msg := &waProto.Message{
		Conversation: proto.String(req.MessageText),
	}

	_, err := client.SendMessage(context.Background(), jid, msg)
	if err != nil {
		sendJSONResponse(w, http.StatusInternalServerError, SendResponse{Success: false, Error: fmt.Sprintf("Failed to send message: %v", err)})
		return
	}

	sendJSONResponse(w, http.StatusOK, SendResponse{Success: true})
}

func sendJSONResponse(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}
