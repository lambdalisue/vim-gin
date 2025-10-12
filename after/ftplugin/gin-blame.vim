" This file is in after/ftplugin/ to ensure it runs AFTER other filetypes' ftplugin
" For compound filetypes like 'typescript.gin-blame', Vim loads:
"   1. ftplugin/typescript.vim
"   2. ftplugin/gin-blame.vim
"   3. after/ftplugin/typescript.vim
"   4. after/ftplugin/gin-blame.vim  <- This ensures gin-blame mappings override others
" This is necessary because some filetypes (e.g. typescript) may define <C-O>/<C-I> mappings
" that would conflict with gin-blame's history navigation.

if exists('b:did_ftplugin_gin_blame_after')
  finish
endif
let b:did_ftplugin_gin_blame_after = 1

" Define Plug mappings for this buffer
nnoremap <buffer> <silent> <Plug>(gin-blame-switch-commit) <Cmd>call denops#request('gin', 'blame:switch_to_commit', [])<CR>
nnoremap <buffer> <silent> <Plug>(gin-blame-navigate-older) <Cmd>call denops#request('gin', 'blame:navigate_history', ['older'])<CR>
nnoremap <buffer> <silent> <Plug>(gin-blame-navigate-newer) <Cmd>call denops#request('gin', 'blame:navigate_history', ['newer'])<CR>

" Default mappings (can be disabled with g:gin_blame_disable_default_mappings)
if !get(g:, 'gin_blame_disable_default_mappings', 0)
  nmap <buffer> <CR> <Plug>(gin-blame-switch-commit)
  nmap <buffer> <C-O> <Plug>(gin-blame-navigate-older)
  nmap <buffer> <C-I> <Plug>(gin-blame-navigate-newer)
endif
