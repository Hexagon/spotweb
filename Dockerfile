FROM denoland/deno:alpine-1.30.0

# Install base packages
RUN apk update
RUN apk upgrade
RUN apk add ca-certificates && update-ca-certificates

# Change TimeZone
RUN apk add --update tzdata

# Clean APK cache
RUN rm -rf /var/cache/apk/*

# Copy spotweb script
RUN mkdir /spotweb
RUN mkdir /spotweb/db
COPY . /spotweb/

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN ["chmod", "+x", "/docker-entrypoint.sh"]

# Go!
ENTRYPOINT ["/docker-entrypoint.sh"]