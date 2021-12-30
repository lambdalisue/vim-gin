if exists('g:loaded_gin_reload')
  finish
endif
let g:loaded_gin_reload = 1

function! s:command(...) abort
  let bufnr = a:0 ? str2nr(a:1) : bufnr('%')
  call denops#plugin#wait('gin')
  call denops#request('gin', 'reload:command', [bufnr])
endfunction

command! -bar -nargs=? GinReload call s:command(<f-args>)
