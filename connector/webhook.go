package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types/events"
)

// We will set this up securely later. For MVP, we pass sender to python.
type WebhookPayload struct {
	Sender       string `json:"sender"`
	Chat         string `json:"chat"`
	Message      string `json:"message"`
	IsFromMe     bool   `json:"is_from_me"`
	IsGroup      bool   `json:"is_group"`
	IsNewsletter bool   `json:"is_newsletter"`
	AudioPath    string `json:"audio_path"`
	PushName     string `json:"push_name"`
}

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:

		text := v.Message.GetConversation()
		if text == "" && v.Message.GetExtendedTextMessage() != nil {
			text = v.Message.GetExtendedTextMessage().GetText()
		}

		var audioPath string
		if audioMsg := v.Message.GetAudioMessage(); audioMsg != nil {
			data, err := cli.Download(context.Background(), audioMsg)
			if err != nil {
				fmt.Printf("Failed to download audio: %v\n", err)
			} else {
				downloadsDir := filepath.Join("..", "brain", "downloads")
				os.MkdirAll(downloadsDir, os.ModePerm)
				filename := fmt.Sprintf("voice_%d.ogg", time.Now().UnixNano())
				fullPath := filepath.Join(downloadsDir, filename)
				err = os.WriteFile(fullPath, data, 0644)
				if err != nil {
					fmt.Printf("Failed to save audio file: %v\n", err)
				} else {
					audioPath = fullPath
					fmt.Printf("Saved audio message to %s\n", fullPath)
				}
			}
		}

		if text == "" && audioPath == "" {
			return // ignore non-text and non-audio messages
		}

		sender := v.Info.Sender.ToNonAD().String()
		chat := v.Info.Chat.ToNonAD().String()
		isFromMe := v.Info.IsFromMe
		isGroup := v.Info.IsGroup || strings.HasSuffix(chat, "@g.us")
		isNewsletter := strings.HasSuffix(chat, "@newsletter") || strings.HasSuffix(chat, "@broadcast")
		pushName := v.Info.PushName

		fmt.Printf("Received message from %s (Chat: %s, IsFromMe: %t, Group: %t, Newsletter: %t, PushName: %s): %s\n", sender, chat, isFromMe, isGroup, isNewsletter, pushName, text)

		payload := WebhookPayload{
			Sender:       sender,
			Chat:         chat,
			Message:      text,
			IsFromMe:     isFromMe,
			IsGroup:      isGroup,
			IsNewsletter: isNewsletter,
			AudioPath:    audioPath,
			PushName:     pushName,
		}
		
		payloadBytes, err := json.Marshal(payload)
		if err != nil {
			fmt.Println("Error encoding webhook:", err)
			return
		}
		
		// Send to Python Brain
		resp, err := http.Post("http://127.0.0.1:8000/webhook", "application/json", bytes.NewBuffer(payloadBytes))
		if err != nil {
			fmt.Println("Failed to send webhook to Python brain:", err)
			return
		}
		defer resp.Body.Close()
		fmt.Println("Message forwarded to Brain.")
	}
}
