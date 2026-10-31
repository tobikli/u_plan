{
  description = "UPlan development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  # Unstable no longer supports Intel macOS; keep its supported stable branch.
  inputs.nixpkgs-intel-darwin.url = "github:NixOS/nixpkgs/nixpkgs-26.05-darwin";

  outputs = { nixpkgs, nixpkgs-intel-darwin, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = (if system == "x86_64-darwin" then nixpkgs-intel-darwin else nixpkgs).legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_26 # Includes npm; project tools come from package-lock.json.
              pkgs.git
              pkgs.supabase-cli
            ];
          };
        });
    };
}
