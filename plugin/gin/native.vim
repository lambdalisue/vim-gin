if exists('g:loaded_gin_native')
  finish
endif
let g:loaded_gin_native = 1

augroup gin_plugin_native_internal
  autocmd!
  autocmd User GinNativeCommandPre :
  autocmd User GinNativeCommandPost :
augroup END

function! s:command(...) abort
  let l:Callback = function('denops#notify', [
        \ 'gin',
        \ 'native:command',
        \ a:000,
        \])
  call denops#plugin#wait_async('gin', l:Callback)
endfunction

command! -bar -nargs=* Gin call s:command(<f-args>)
