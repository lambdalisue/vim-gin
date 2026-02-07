if exists('g:loaded_gin_reflog')
  finish
endif
let g:loaded_gin_reflog = 1

augroup gin_plugin_reflog_internal
  autocmd!
  autocmd BufReadCmd ginreflog://*
        \ call denops#request('gin', 'reflog:edit', [bufnr(), expand('<amatch>')])
  autocmd FileReadCmd ginreflog://*
        \ call denops#request('gin', 'reflog:read', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'reflog:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinReflog call s:command(<q-bang>, <q-mods>, [<f-args>])
