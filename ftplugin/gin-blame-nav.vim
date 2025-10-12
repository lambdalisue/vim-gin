if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

" Prevent buffer switching in this window
setlocal winfixbuf

" Define Plug mappings for this buffer
nnoremap <buffer> <silent> <Plug>(gin-blame-switch-commit) <Cmd>call denops#notify('gin', 'blame:switch_to_commit', [])<CR>
nnoremap <buffer> <silent> <Plug>(gin-blame-navigate-older) <Cmd>call denops#notify('gin', 'blame:navigate_history', ['older'])<CR>
nnoremap <buffer> <silent> <Plug>(gin-blame-navigate-newer) <Cmd>call denops#notify('gin', 'blame:navigate_history', ['newer'])<CR>

" Default mappings (can be disabled with g:gin_blame_disable_default_mappings)
if !get(g:, 'gin_blame_disable_default_mappings', 0)
  nmap <buffer> <CR> <Plug>(gin-blame-switch-commit)
  nmap <buffer> <C-O> <Plug>(gin-blame-navigate-older)
  nmap <buffer> <C-I> <Plug>(gin-blame-navigate-newer)
endif

" Undo ftplugin settings
let b:undo_ftplugin = 'setlocal winfixbuf< |'
      \ . ' silent! nunmap <buffer> <CR> |'
      \ . ' silent! nunmap <buffer> <C-O> |'
      \ . ' silent! nunmap <buffer> <C-I> |'
      \ . ' silent! unmap <buffer> <Plug>(gin-blame-switch-commit) |'
      \ . ' silent! unmap <buffer> <Plug>(gin-blame-navigate-older) |'
      \ . ' silent! unmap <buffer> <Plug>(gin-blame-navigate-newer)'
