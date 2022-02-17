if exists('g:loaded_gin_chaperon')
  finish
endif
let g:loaded_gin_chaperon = 1

function! s:command(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'chaperon:command', a:000)
endfunction

command! -bar -nargs=* GinChaperon call s:command(<f-args>)
