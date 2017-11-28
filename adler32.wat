(module
	(memory (import "env" "memory") 1)
	(global (export "digest32_adler_zero") i32 i32.const 1)
	(func (export "digest32_adler") (param $adler i32) (param $ptr i32) (param $endPtr i32) (result i32)
		(local $a i32)
		(local $b i32)
		(set_local $a (i32.and (get_local $adler) (i32.const 0xffff)))
		(set_local $b (i32.shr_u (get_local $adler) (i32.const 16)))
		(block
			(br_if 0 (i32.ge_u (get_local $ptr) (get_local $endPtr)))
			(loop
				(set_local $a (i32.rem_u
					(i32.add (get_local $a) (i32.load8_u (get_local $ptr)))
					(i32.const 65521)
				))
				(set_local $b (i32.rem_u
					(i32.add (get_local $b) (get_local $a))
					(i32.const 65521)
				))
				(set_local $ptr (i32.add (get_local $ptr) (i32.const 1)))
				(br_if 0 (i32.lt_u (tee_local $ptr (i32.add (get_local $ptr) (i32.const 1))) (get_local $endPtr)))
			)
		)
		(i32.or (get_local $a) (i32.shl (get_local $b) (i32.const 16)))
	)
)
