if exists('g:loaded_gin_discard')
  finish
endif
let g:loaded_gin_discard = 1

augroup gin_plugin_discard_internal
  autocmd!
  autocmd BufReadCmd gindiscard://* call denops#request('gin', 'discard:read', [])
augroup END

function! s:command(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'discard:command', a:000)
endfunction

command! -bar -nargs=* GinDiscard call s:command(<f-args>)
