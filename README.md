# 🥃 vim-gin

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![vim help](https://img.shields.io/badge/vim-%3Ah%20gin-orange.svg)](doc/gin.txt)
[![test](https://github.com/lambdalisue/vim-gin/actions/workflows/test.yml/badge.svg)](https://github.com/lambdalisue/vim-gin/actions/workflows/test.yml)

Gin (_vim-gin_) is a plugin to handle git repository from Vim/Neovim.

**Alpha version. Any changes, including backward incompatible ones, are applied
without announcements.**

## Features

- Proxy the prompts/editor used by git commands to Vim
- Components to show information on `statusline` and/or `tabline`
- `Gin` to call a raw git command and echo the result
- `GinBuffer` to call a raw git command and open a result buffer
- `GinBranch` to see `git branch` of a repository
- `GinBrowse` to visit the hosting service webpage of a repository (powered by
  [git-browse](https://deno.land/x/git_browse))
- `GinCd/GinLcd/GinTcd` to invoke `cd/lcd/tcd` to the repository root
- `GinChaperon` to solve git conflicts (like `git mergetool`)
- `GinDiff` to see `git diff` of a file
- `GinEdit` to see `git show` of a file
- `GinLog` to see `git log` of a repository/file
- `GinPatch` to stage changes partially (like `git add -p`)
- `GinStatus` to see `git status` of a repository

See [Features](https://github.com/lambdalisue/vim-gin/wiki/Features) in Wiki for
detail about each features.

## Requirements

Gin is written in denops thus users need to install [Deno](https://deno.land)
and denops.vim

- [vim-denops/denops.vim][vim-denops/denops.vim]<br> An ecosystem for writing
  Vim/Neovim plugin in Deno.

[vim-denops/denops.vim]: https://github.com/vim-denops/denops.vim

## Installation

Install [Deno](https://deno.land) then use
[vim-plug](https://github.com/junegunn/vim-plug) to install like:

```vim
Plug 'vim-denops/denops.vim'
Plug 'lambdalisue/vim-gin'
```

Or see
[How to install](https://github.com/lambdalisue/vim-gin/wiki#how-to-install)
section in Wiki for other Vim plugin managers.

## Similar projects

- [tpope/vim-fugitive](https://github.com/tpope/vim-fugitive)<br>A plugin that
  lead me to the development of gita.vim
- [lambdalisue/vim-gita](https://github.com/lambdalisue/vim-gita)<br>First git
  manipulation plugin that I made, works on Vim 7.4
- [lambdalisue/gina.vim](https://github.com/lambdalisue/gina.vim)<br>Second git
  manipulation plugin that I made, works asynchronously on Vim 8.1

## License

The code in this repository follows MIT license, texted in [LICENSE](./LICENSE).
Contributors need to agree that any modifications sent in this repository follow
the license.
