if exists('g:loaded_gin_patch')
  finish
endif
let g:loaded_gin_patch = 1

function! s:command(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'patch:command', a:000)
endfunction

command! -bar -nargs=* GinPatch call s:command(<f-args>)
