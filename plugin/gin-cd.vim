if exists('g:loaded_gin_cd')
  finish
endif
let g:loaded_gin_cd = 1

function! s:command(cmd) abort
  if denops#plugin#wait('gin')
    return
  endif
  try
    let worktree = gin#util#worktree()
    execute printf('%s %s', a:cmd, fnameescape(worktree))
    echo printf('[gin] %s on "%s"', a:cmd, worktree)
  catch
    echohl WarningMsg
    echo '[gin] no git repository found'
    echohl None
  endtry
endfunction

command! -bar -nargs=0 GinCd call s:command('cd')
command! -bar -nargs=0 GinLcd call s:command('lcd')
command! -bar -nargs=0 GinTcd call s:command('tcd')
