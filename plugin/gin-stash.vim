if exists('g:loaded_gin_stash')
  finish
endif
let g:loaded_gin_stash = 1

augroup gin_plugin_stash_internal
  autocmd!
  autocmd BufReadCmd ginstash://*
        \ call denops#request('gin', 'stash:edit', [bufnr(), expand('<amatch>')])
  autocmd FileReadCmd ginstash://*
        \ call denops#request('gin', 'stash:read', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'stash:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinStash call s:command(<q-bang>, <q-mods>, [<f-args>])
