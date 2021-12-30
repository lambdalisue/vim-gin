if exists('g:loaded_gin_status')
  finish
endif
let g:loaded_gin_status = 1

augroup gin_plugin_status_internal
  autocmd!
  autocmd BufReadCmd ginstatus://* call denops#request('gin', 'status:read', [])
augroup END

function! s:command(...) abort
  let l:Callback = function('denops#notify', [
        \ 'gin',
        \ 'status:command',
        \ a:000,
        \])
  call denops#plugin#wait_async('gin', l:Callback)
endfunction

command! -bar -nargs=* GinStatus call s:command(<f-args>)
