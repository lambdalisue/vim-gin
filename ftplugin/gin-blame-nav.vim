if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

" Prevent buffer switching in this window
setlocal winfixbuf

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
