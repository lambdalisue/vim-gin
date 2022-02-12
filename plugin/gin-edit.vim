if exists('g:loaded_gin_edit')
  finish
endif
let g:loaded_gin_edit = 1

augroup gin_plugin_edit_internal
  autocmd!
  autocmd BufReadCmd ginedit://* call denops#request('gin', 'edit:read', [])
augroup END

function! s:command(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'edit:command', a:000)
endfunction

command! -bar -nargs=* GinEdit call s:command(<f-args>)
