if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nobuflisted
setlocal nolist nospell
setlocal nowrap nofoldenable
setlocal nomodeline

" Alias
map <buffer> <Plug>(gin-action-edit) <Plug>(gin-action-edit:local)
map <buffer> <Plug>(gin-action-edit:edit) <Plug>(gin-action-edit:local:edit)
map <buffer> <Plug>(gin-action-edit:split) <Plug>(gin-action-edit:local:split)
map <buffer> <Plug>(gin-action-edit:vsplit) <Plug>(gin-action-edit:local:vsplit)
map <buffer> <Plug>(gin-action-edit:tabedit) <Plug>(gin-action-edit:local:tabedit)
map <buffer> <Plug>(gin-action-edit:local) <Plug>(gin-action-edit:local:edit)
map <buffer> <Plug>(gin-action-edit:cached) <Plug>(gin-action-edit:cached:edit)
map <buffer> <Plug>(gin-action-edit:HEAD) <Plug>(gin-action-edit:HEAD:edit)

map <buffer> <Plug>(gin-action-diff) <Plug>(gin-action-diff:smart)
map <buffer> <Plug>(gin-action-diff:edit) <Plug>(gin-action-diff:smart:edit)
map <buffer> <Plug>(gin-action-diff:split) <Plug>(gin-action-diff:smart:split)
map <buffer> <Plug>(gin-action-diff:vsplit) <Plug>(gin-action-diff:smart:vsplit)
map <buffer> <Plug>(gin-action-diff:tabedit) <Plug>(gin-action-diff:smart:tabedit)
map <buffer> <Plug>(gin-action-diff:local) <Plug>(gin-action-diff:local:edit)
map <buffer> <Plug>(gin-action-diff:cached) <Plug>(gin-action-diff:cached:edit)
map <buffer> <Plug>(gin-action-diff:HEAD) <Plug>(gin-action-diff:HEAD:edit)
map <buffer> <Plug>(gin-action-diff:smart) <Plug>(gin-action-diff:smart:edit)

map <buffer> <Plug>(gin-action-chaperon) <Plug>(gin-action-chaperon:both)

map <buffer> <Plug>(gin-action-patch) <Plug>(gin-action-patch:both)

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
endif
