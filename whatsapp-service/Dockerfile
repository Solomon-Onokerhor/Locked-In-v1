# ---- Build Stage ----
FROM golang:1.22-alpine AS builder

# Install gcc for cgo (needed by some indirect deps)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o whatsapp-service .

# ---- Run Stage ----
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy binary from build stage
COPY --from=builder /app/whatsapp-service .

# The store.db will be persisted via a Railway/Fly.io volume mounted at /app/data
ENV STORE_PATH=/app/data/store.db
ENV PORT=8081

EXPOSE 8081

CMD ["./whatsapp-service"]
