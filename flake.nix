{
  description = "Development environment with Node.js 22 and PNPM 9";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [ nodejs_22 pnpm_9 turbo ];

          shellHook = ''
            echo "Node.js $(node --version) and PNPM $(pnpm --version) environment activated"
          '';
        };
      });
}
