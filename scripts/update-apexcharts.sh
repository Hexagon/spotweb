#!/bin/sh
# Update the vendored ApexCharts in static/assets/vendor/ from the npm registry.
# Dependabot does not track it.
#
#   scripts/update-apexcharts.sh 3.54.1
#
# Check the release notes (https://github.com/apexcharts/apexcharts.js/releases) first, then
# look at the charts on an area page, a country page, the start page and /custom.
set -eu

version="${1:?usage: $0 <version>}"
dir="$(cd "$(dirname "$0")/../static/assets/vendor" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl -fsSL "https://registry.npmjs.org/apexcharts/-/apexcharts-${version}.tgz" -o "$tmp/apexcharts.tgz"
tar -xzf "$tmp/apexcharts.tgz" -C "$tmp" package/dist/apexcharts.min.js package/LICENSE
head -c 200 "$tmp/package/dist/apexcharts.min.js" | grep -q "ApexCharts v${version}" || {
    echo "downloaded file is not ApexCharts ${version}" >&2
    exit 1
}
cp "$tmp/package/dist/apexcharts.min.js" "$dir/apexcharts.min.js"
cp "$tmp/package/LICENSE" "$dir/apexcharts.LICENSE.txt"
echo "ApexCharts ${version} vendored in ${dir}"
