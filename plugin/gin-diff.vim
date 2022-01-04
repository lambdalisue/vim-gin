if exists('g:loaded_gin_diff')
  finish
endif
let g:loaded_gin_diff = 1

augroup gin_plugin_diff_internal
  autocmd!
  autocmd BufReadCmd gindiff://* call denops#request('gin', 'diff:read', [])
augroup END

function! s:command(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'diff:command', a:000)
endfunction

function! s:command_file(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'diff:command:file', a:000)
endfunction

command! -bar -nargs=* GinDiff call s:command(<f-args>)
command! -bar -nargs=* GinDiffFile call s:command_file(<f-args>)
