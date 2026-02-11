{
  description = "A fast, minimal TUI for Todoist.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = [
        "aarch64-darwin"
        "x86_64-linux"
      ];

      perSystem = {pkgs, ...}: {
        packages.default = pkgs.buildNpmPackage {
          pname = "dewy";
          version = "0.0.0";
          src = ./.;
          npmDepsHash = "sha256-87WINB2MVHkBRcDiV8Sm9lEWrQR0N3QtzEcX3/Vb9Zg=";
          nodejs = pkgs.nodejs_20;

          buildPhase = ''
            npm run build
          '';

          installPhase = ''
            mkdir -p $out/lib/dewy $out/bin
            cp -r dist node_modules package.json $out/lib/dewy/
            makeWrapper ${pkgs.nodejs_20}/bin/node $out/bin/dewy \
              --add-flags "$out/lib/dewy/dist/cli.js"
          '';

          nativeBuildInputs = [pkgs.makeWrapper];
        };
      };
    };
}
