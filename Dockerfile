FROM denoland/deno:debian-1.31.3

# Copy spotweb script
RUN mkdir /spotweb
RUN mkdir /spotweb/db
COPY . /spotweb/

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN ["chmod", "+x", "/docker-entrypoint.sh"]

# Go!
ENTRYPOINT ["/docker-entrypoint.sh"]