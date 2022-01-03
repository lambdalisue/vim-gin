# 🥃 gin.vim

[![Deno 1.11.0 or above](https://img.shields.io/badge/Deno-Support%201.11.0-yellowgreen.svg?logo=deno)](https://github.com/denoland/deno/tree/v1.11.0)
[![Vim 8.2.0662 or above](https://img.shields.io/badge/Vim-Support%208.2.0662-yellowgreen.svg?logo=vim)](https://github.com/vim/vim/tree/v8.2.0662)
[![Neovim 0.4.4 or above](https://img.shields.io/badge/Neovim-Support%200.4.4-yellowgreen.svg?logo=neovim&logoColor=white)](https://github.com/neovim/neovim/tree/v0.4.4)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![vim help](https://img.shields.io/badge/vim-%3Ah%20gin-orange.svg)](doc/gin.txt)
[![test](https://github.com/lambdalisue/gin.vim/actions/workflows/test.yml/badge.svg)](https://github.com/lambdalisue/gin.vim/actions/workflows/test.yml)

Gin (_gin.vim_) is a plugin to handle git repository from Vim/Neovim.

**UNDER DEVELOPMENT**

## Requirements

Gin is written in denops thus users need to install denops.vim

- [vim-denops/denops.vim][vim-denops/denops.vim]<br> An ecosystem for writing
  Vim/Neovim plugin in Deno.

Additionally, the following Vim/Neovim plugins are highly recommended to use:

- [lambdalisue/guise.vim][lambdalisue/guise.vim]<br> To open a new tabpage to
  edit a commit message on `Gin commit`.
- [lambdalisue/askpass.vim][lambdalisue/askpass.vim]<br> To input SSH key
  passphrase on `Gin push` or so on.

[vim-denops/denops.vim]: https://github.com/vim-denops/denops.vim
[lambdalisue/guise.vim]: https://github.com/lambdalisue/guise.vim
[lambdalisue/askpass.vim]: https://github.com/lambdalisue/askpass.vim

## Similar projects

- [lambdalisue/gina.vim](https://github.com/lambdalisue/gina.vim)
- [tpope/vim-fugitive](https://github.com/tpope/vim-fugitive)

## License

The code in this repository follows MIT license, texted in [LICENSE](./LICENSE).
Contributors need to agree that any modifications sent in this repository follow
the license.
