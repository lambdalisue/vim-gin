if exists('g:loaded_gin_diff')
  finish
endif
let g:loaded_gin_diff = 1

augroup gin_plugin_diff_internal
  autocmd!
  autocmd BufReadCmd gindiff://* call denops#request('gin', 'diff:read', [])
augroup END

function! s:command(...) abort
  let l:Callback = function('denops#notify', [
        \ 'gin',
        \ 'diff:command',
        \ a:000,
        \])
  call denops#plugin#wait_async('gin', l:Callback)
endfunction

command! -bar -nargs=* GinDiff call s:command(<f-args>)
