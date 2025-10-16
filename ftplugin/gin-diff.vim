if exists('b:did_ftplugin')
  finish
endif
runtime ftplugin/diff.vim

let s:winid = win_getid()
call timer_start(0, { -> win_execute(s:winid, 'setlocal foldlevel=1') })

if !get(g:, 'gin_diff_disable_default_mappings')
  nmap <buffer> <CR> <Plug>(gin-diffjump-smart)zv
  nmap <buffer> g<CR> <Plug>(gin-diffjump-old)zv
  nmap <buffer> <C-g><CR> <Plug>(gin-diffjump-new)zv
endif

let b:did_ftplugin = 1
