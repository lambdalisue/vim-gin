if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nobuflisted
setlocal nolist nospell
setlocal nowrap nofoldenable
setlocal nomodeline

if !get(g:, 'gin_status_disable_default_mappings')
  map <buffer><nowait> a <Plug>(gin-action-choice)
  map <buffer><nowait> . <Plug>(gin-action-repeat)
  nmap <buffer><nowait> ? <Plug>(gin-action-help)

  map <buffer><nowait> <Return> <Plug>(gin-action-edit)zv

  map <buffer><nowait> dd <Plug>(gin-action-diff:smart)

  map <buffer><nowait> pp <Plug>(gin-action-patch)

  map <buffer><nowait> !! <Plug>(gin-action-chaperon)

  map <buffer><nowait> << <Plug>(gin-action-stage)
  map <buffer><nowait> >> <Plug>(gin-action-unstage)
  map <buffer><nowait> == <Plug>(gin-action-stash)

  nmap <buffer><nowait> yy <Plug>(gin-action-yank:path)
  vmap <buffer><nowait> y <Plug>(gin-action-yank:path)<Esc>
endif
