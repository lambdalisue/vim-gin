if exists('g:loaded_gin_tree')
  finish
endif
let g:loaded_gin_tree = 1

augroup gin_plugin_tree_internal
  autocmd!
  autocmd BufReadCmd gintree://*
        \ call denops#request('gin', 'tree:edit', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'tree:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=? GinTree call s:command(<q-bang>, <q-mods>, [<f-args>])