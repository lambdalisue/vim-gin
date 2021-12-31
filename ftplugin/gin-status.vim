if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal bufhidden=hide
setlocal nobuflisted
setlocal nolist nospell
setlocal nowrap nofoldenable

if !get(g:, 'gin_ginstatus_disable_default_mappings')
  map <buffer> <Return>  <Plug>(gin-action-open)
  map <buffer> <<        <Plug>(gin-action-stage)
  map <buffer> >>        <Plug>(gin-action-unstage)
endif
