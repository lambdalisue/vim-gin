if exists('b:did_ftplugin')
  finish
endif
runtime ftplugin/diff.vim

if !get(g:, 'gin_diff_disable_default_mappings')
  nmap <buffer> g<CR> <Plug>(gin-diffjump-old)zv
  nmap <buffer> <CR> <Plug>(gin-diffjump-new)zv
endif

let b:did_ftplugin = 1
