if exists('g:loaded_gin_show')
  finish
endif
let g:loaded_gin_show = 1

augroup gin_plugin_show_internal
  autocmd!
  autocmd BufReadCmd ginshow://* call denops#request('gin', 'show:read', [])
augroup END

function! s:command(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'show:command', a:000)
endfunction

function! s:command_file(...) abort
  call denops#plugin#wait('gin')
  call denops#request('gin', 'show:command:file', a:000)
endfunction

command! -bar -nargs=* GinShow call s:command(<f-args>)
command! -bar -nargs=* GinShowFile call s:command_file(<f-args>)
