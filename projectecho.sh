#!/bin/sh

# ProjectEcho Debug Mode
# Full POSIX script with verbose logging, jq free

set -e

AGENT_ID=6747273483102031

# load .env
if [ ! -f .env ]; then
    echo ".env missing"
    exit 1
fi

while IFS='=' read -r key value; do
    case "$key" in
        PHANTOMBUSTER_API_KEY|LI_AT|POST_URL)
            export "$key=$value"
            ;;
    esac
done < .env

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    printf "%s | %s\n" "$(timestamp)" "$1"
}

log "Launching PhantomBuster agent $AGENT_ID"

launch=$(curl -s -w "\nHTTP_CODE=%{http_code}\n" -X POST \
  "https://api.phantombuster.com/api/v2/agents/launch" \
  -H "X-Phantombuster-Key-1: $PHANTOMBUSTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
        \"id\": \"$AGENT_ID\",
        \"argument\": {
            \"csvName\": \"result\",
            \"sessionCookie\": \"$LI_AT\",
            \"userAgent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)\",
            \"postUrl\": \"$POST_URL\",
            \"removeDuplicate\": false
        }
      }")

log "Launch response:"
printf "%s\n" "$launch"

container_id=$(printf "%s" "$launch" | grep -o '"containerId":[^,]*' | sed 's/[^0-9]//g')

if [ -z "$container_id" ]; then
    log "Launch failed. Raw response above."
    exit 1
fi

log "Container ID: $container_id"
log "Starting poll loop"

tmpfile=$(mktemp)
touch "$tmpfile"

poll_count=0

while true; do
    poll_count=$((poll_count + 1))
    log "Polling attempt $poll_count"

    response=$(curl -s -w "\nHTTP_CODE=%{http_code}\n" \
      -H "X-Phantombuster-Key-1: $PHANTOMBUSTER_API_KEY" \
      "https://api.phantombuster.com/api/v2/containers/fetch?id=$container_id&withOutput=true")

    http_code=$(printf "%s" "$response" | grep HTTP_CODE | cut -d= -f2)
    clean=$(printf "%s" "$response" | sed '/HTTP_CODE=/d')

    log "HTTP code: $http_code"

    status=$(printf "%s" "$clean" | grep -o '"status":"[^"]*"' | cut -d\" -f4)

    log "Container status: $status"

    log "Extracting phantom logs:"
    printf "%s" "$clean" | grep -Eo '\[info_][^\n]*|\[error][^\n]*' || log "No logs emitted yet"

    printf "%s" "$clean" \
      | grep -Eo 'https://www\.linkedin\.com/[^" ]+' \
      | while read -r url; do
            if ! grep -Fxq "$url" "$tmpfile"; then
                log "FOUND NEW URL: $url"
                echo "$url" >> "$tmpfile"
            fi
        done

    printf "%s" "$clean" | grep -qi "error" && {
        log "ERROR detected"
        printf "%s\n" "$clean"
        rm -f "$tmpfile"
        exit 1
    }

    if [ "$status" = "finished" ]; then
        total=$(wc -l < "$tmpfile" | tr -d ' ')
        log "FINISHED. Total URLs: $total"
        if [ "$total" -eq 0 ]; then
            log "Full raw response for debugging:"
            printf "%s\n" "$clean"
        fi
        rm -f "$tmpfile"
        exit 0
    fi

    sleep 4
done

