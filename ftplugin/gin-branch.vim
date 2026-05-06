if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nolist nospell
setlocal nowrap nofoldenable
setlocal nomodeline

if !get(g:, 'gin_branch_disable_default_mappings')
  map <buffer><nowait> a <Plug>(gin-action-choice)
  map <buffer><nowait> . <Plug>(gin-action-repeat)
  nmap <buffer><nowait> ? <Plug>(gin-action-help)

  nmap <buffer><nowait> <Return> <Plug>(gin-action-switch)

  nmap <buffer><nowait> yy <Plug>(gin-action-yank:branch)
  vmap <buffer><nowait> y <Plug>(gin-action-yank:branch)<Esc>
endif
