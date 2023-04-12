if exists('g:loaded_gin_log')
  finish
endif
let g:loaded_gin_log = 1

augroup gin_plugin_log_internal
  autocmd!
  autocmd BufReadCmd ginlog://*
        \ call denops#request('gin', 'log:edit', [bufnr(), expand('<amatch>')])
  autocmd FileReadCmd ginlog://*
        \ call denops#request('gin', 'log:read', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'log:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinLog call s:command(<q-bang>, <q-mods>, [<f-args>])
