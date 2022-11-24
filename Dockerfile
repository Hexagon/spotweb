FROM denoland/deno:alpine-1.28.1

# Copy radoneye script
RUN mkdir /spotweb
COPY build/spotweb.ts /spotweb/
COPY static /spotweb/static

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN ["chmod", "+x", "/docker-entrypoint.sh"]

# Go!
ENTRYPOINT ["/docker-entrypoint.sh"]