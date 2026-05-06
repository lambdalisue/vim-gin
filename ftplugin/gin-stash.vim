if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nobuflisted
setlocal nolist nospell
setlocal nowrap nofoldenable
setlocal cursorline
setlocal nomodeline

if !get(g:, 'gin_stash_disable_default_mappings')
  map <buffer><nowait> a <Plug>(gin-action-choice)
  map <buffer><nowait> . <Plug>(gin-action-repeat)
  nmap <buffer><nowait> ? <Plug>(gin-action-help)

  map <buffer><nowait> <Return> <Plug>(gin-action-show)zv

  nmap <buffer><nowait> yy <Plug>(gin-action-yank:stash)
  vmap <buffer><nowait> y <Plug>(gin-action-yank:stash)<Esc>
endif
