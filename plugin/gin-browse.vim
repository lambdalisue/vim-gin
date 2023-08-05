if exists('g:loaded_gin_browse')
  finish
endif
let g:loaded_gin_browse = 1

function! s:command(args, range, range_given) abort
  let l:Callback = function('denops#notify', [
        \ 'gin',
        \ 'browse:command',
        \ a:range_given ? [a:args, a:range] : [a:args],
        \])
  call denops#plugin#wait_async('gin', l:Callback)
endfunction

command! -bar -range=0 -nargs=* GinBrowse call s:command([<f-args>], [<line1>, <line2>], <count>)
