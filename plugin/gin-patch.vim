if exists('g:loaded_gin_patch')
  finish
endif
let g:loaded_gin_patch = 1

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'patch:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinPatch call s:command(<q-bang>, <q-mods>, [<f-args>])
