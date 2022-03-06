if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nolist nospell
setlocal nowrap nofoldenable

if !get(g:, 'gin_branch_disable_default_mappings')
  nmap <buffer><nowait> <Return> <Plug>(gin-action-switch)
endif
