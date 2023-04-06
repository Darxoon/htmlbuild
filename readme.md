# HTMLbuild

Simple HTML build tool

## Installation

Make sure you have the latest node.js LTS version, TypeScript and NPM installed.

Clone the repository with `git clone https://github.com/Darxoon/htmlbuild` and enter the new directory.
Run `npm install && tsc && npm link` in a command prompt or shell here (not PowerShell). Now you can access the `htmlbuild` command from everywhere.

## Usage

In the root of your HTML project, run `htmlbuild init` to create a config file. Create a `src` and `static` folder (or with different names, but update the names in the config file too). In the `src` folder, place your HTML files and in the `static` folder, place your other files, such as .css or .js files. Run `htmlbuild build` to do a build process and build the target folder (`dist`) or run `htmlbuild watch` to make it watch for file changes continuously and update them in real time.

### Layout files

If you name an HTML file `~layout.html`, it will serve as the parent for all other HTML files in the same directory or subdirectories. Place the string `%{content}` in the layout file and all other HTML files will follow the pattern, with the `%{content}` tag replaced with the content of the HTML file.

If you want to reference a file in a layout file, write `%{path path/to/file}` and it will be replaced with the updated path in all dependant files.

### Usage with other build tools

TO DO.

## Contact

For any discussions or help regarding using this program, join the Paper Mario: The Origami King Refolded server (https://discord.gg/y7qfTKyhZy) or the Paper Mario Modding server (https://discord.gg/Pj4u7wB) and seek me out (Darxoon#2884).

In case you encounter any issues while using this program, open a Github Issue or contact me as described above.
