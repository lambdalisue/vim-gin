if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nolist nospell
setlocal nowrap nofoldenable

map <buffer> <Plug>(gin-action-merge) <Plug>(gin-action-merge:ff)

if !get(g:, 'gin_branch_disable_default_mappings')
  map <buffer><nowait> a <Plug>(gin-action-choice)
  map <buffer><nowait> . <Plug>(gin-action-repeat)
  nmap <buffer><nowait> ? <Plug>(gin-action-help)

  nmap <buffer><nowait> <Return> <Plug>(gin-action-switch)
endif
