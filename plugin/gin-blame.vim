if exists('g:loaded_gin_blame')
  finish
endif
let g:loaded_gin_blame = 1

augroup gin_plugin_blame_internal
  autocmd!
  autocmd BufReadCmd ginblame://*
        \ call denops#request('gin', 'blame:edit', [bufnr(), expand('<amatch>')])
  autocmd BufReadCmd ginblamenav://*
        \ call denops#request('gin', 'blame:edit:nav', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'blame:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinBlame call s:command(<q-bang>, <q-mods>, [<f-args>])

highlight GinBlameDivider gui=strikethrough cterm=strikethrough guifg=#505050 ctermfg=black
sign define GinBlameDividerSign linehl=GinBlameDivider
