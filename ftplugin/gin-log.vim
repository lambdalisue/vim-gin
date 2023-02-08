if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal nobuflisted
setlocal nolist nospell
setlocal nowrap nofoldenable
setlocal cursorline

if !get(g:, 'gin_log_disable_default_mappings')
  map <buffer><nowait> a <Plug>(gin-action-choice)
  map <buffer><nowait> . <Plug>(gin-action-repeat)
  nmap <buffer><nowait> ? <Plug>(gin-action-help)

  map <buffer><nowait> <Return> <Plug>(gin-action-show)zv

  nmap <buffer><nowait> yy <Plug>(gin-action-yank:commit)
  vmap <buffer><nowait> y <Plug>(gin-action-yank:commit)<Esc>
endif
