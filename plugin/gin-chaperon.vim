if exists('g:loaded_gin_chaperon')
  finish
endif
let g:loaded_gin_chaperon = 1

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'chaperon:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinChaperon call s:command(<q-bang>, <q-mods>, [<f-args>])
