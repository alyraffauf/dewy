pkgname=dewy-git
pkgver=0.1.1.r1.g007e51d
pkgrel=1
pkgdesc='A fast, minimal TUI for Todoist'
arch=('any')
url='https://github.com/alyraffauf/dewy'
license=('GPL-3.0-or-later')
depends=('nodejs')
makedepends=('npm' 'git')
provides=('dewy')
conflicts=('dewy')
options=('!strip' '!debug')
source=("git+${url}.git")
sha256sums=('SKIP')

pkgver() {
    cd dewy
    git describe --long --tags 2>/dev/null | sed 's/^v//;s/-/.r/;s/-/./' \
        || printf '0.0.0.r%s.%s' "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}

build() {
    cd dewy
    npm ci
    npm run build
}

package() {
    cd dewy
    install -d "${pkgdir}/usr/lib/dewy"
    cp -r dist node_modules package.json "${pkgdir}/usr/lib/dewy/"

    install -d "${pkgdir}/usr/bin"
    printf '#!/bin/sh\nexec node /usr/lib/dewy/dist/cli.js "$@"\n' \
        > "${pkgdir}/usr/bin/dewy"
    chmod 755 "${pkgdir}/usr/bin/dewy"
}
