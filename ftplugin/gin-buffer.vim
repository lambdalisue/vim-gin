if exists('b:did_ftplugin')
  finish
endif

if !get(g:, 'gin_buffer_disable_default_mappings')
  nmap <buffer> <CR> <Plug>(gin-diffjump-smart)zv
  nmap <buffer> g<CR> <Plug>(gin-diffjump-old)zv
  nmap <buffer> <C-g><CR> <Plug>(gin-diffjump-new)zv
endif

let b:did_ftplugin = 1
