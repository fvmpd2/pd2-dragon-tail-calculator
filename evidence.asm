; S13 kick builder
1026ead0:      	pushl	%ebp
1026ead1:      	movl	%esp, %ebp
1026ead3:      	andl	$-0x8, %esp
1026ead6:      	subl	$0x2c, %esp
1026ead9:      	movl	0x1039800c, %eax
1026eade:      	xorl	%esp, %eax
1026eae0:      	movl	%eax, 0x28(%esp)
1026eae4:      	movl	0x8(%ebp), %eax
1026eae7:      	pushl	%ebx
1026eae8:      	movl	0x1c(%ebp), %ebx
1026eaeb:      	pushl	%esi
1026eaec:      	movl	0xc(%ebp), %esi
1026eaef:      	pushl	%edi
1026eaf0:      	pushl	%esi
1026eaf1:      	movl	%eax, 0x28(%esp)
1026eaf5:      	movl	0x10(%ebp), %eax
1026eaf8:      	pushl	%ebx
1026eaf9:      	movl	%esi, 0x28(%esp)
1026eafd:      	movl	%eax, 0x1c(%esp)
1026eb01:      	movl	%ebx, 0x14(%esp)
1026eb05:      	calll	0x102ed0b0
1026eb0a:      	orl	$0x3, (%esi)
1026eb0d:      	pushl	$0x0
1026eb0f:      	pushl	$0x0
1026eb11:      	pushl	%ebx
1026eb12:      	calll	0x10273cb0
1026eb17:      	pushl	$0x0
1026eb19:      	pushl	$0x2
1026eb1b:      	pushl	%ebx
1026eb1c:      	calll	0x10273cb0
1026eb21:      	movl	%eax, %ecx
1026eb23:      	movl	$0x0, 0x2c(%esp)
1026eb2b:      	shll	$0x8, %ecx
1026eb2e:      	movl	%ecx, %eax
1026eb30:      	movl	$0x0, 0x30(%esp)
1026eb38:      	cltd
1026eb39:      	andl	$0x3, %edx
1026eb3c:      	addl	%edx, %eax
1026eb3e:      	sarl	$0x2, %eax
1026eb41:      	movl	%eax, 0x1c(%esp)
1026eb45:      	movl	$0x55555556, %eax       # imm = 0x55555556
1026eb4a:      	imull	%ecx
1026eb4c:      	movl	%edx, %eax
1026eb4e:      	shrl	$0x1f, %eax
1026eb51:      	addl	%edx, %eax
1026eb53:      	movl	%eax, 0x10(%esp)
1026eb57:      	movl	0xc(%esi), %eax
1026eb5a:      	movl	%eax, 0x28(%esp)
1026eb5e:      	leal	0x28(%esp), %eax
1026eb62:      	pushl	%eax
1026eb63:      	leal	0x34(%esp), %eax
1026eb67:      	pushl	%eax
1026eb68:      	leal	0x34(%esp), %eax
1026eb6c:      	pushl	%eax
1026eb6d:      	pushl	%ebx
1026eb6e:      	calll	0x10276ee0
1026eb73:      	movl	0xc(%esp), %eax
1026eb77:      	xorl	%edi, %edi
1026eb79:      	addl	$0x64, 0x28(%esp)
1026eb7e:      	xorl	%ebx, %ebx
1026eb80:      	shll	$0x8, 0x2c(%esp)
1026eb85:      	shll	$0x8, 0x30(%esp)
1026eb8a:      	movl	0x60(%eax), %ecx
1026eb8d:      	movl	%ecx, 0x18(%esp)
1026eb91:      	testl	%ecx, %ecx
1026eb93:      	je	0x1026ec10
1026eb95:      	pushl	%ecx
1026eb96:      	calll	0x102776b0
1026eb9b:      	movl	%eax, %esi
1026eb9d:      	testl	%esi, %esi
1026eb9f:      	je	0x1026ec0c
1026eba1:      	pushl	%esi
1026eba2:      	calll	0x10277710
1026eba7:      	xorl	%ecx, %ecx
1026eba9:      	cmpb	$0x4, %al
1026ebab:      	sete	%cl
1026ebae:      	addl	$0x4, %ecx
1026ebb1:      	pushl	%ecx
1026ebb2:      	pushl	0x1c(%esp)
1026ebb6:      	calll	0x10275b80
1026ebbb:      	pushl	$0x2d
1026ebbd:      	pushl	%esi
1026ebbe:      	calll	0x102759d0
1026ebc3:      	testl	%eax, %eax
1026ebc5:      	je	0x1026ec0c
1026ebc7:      	pushl	%esi
1026ebc8:      	calll	0x10273fb0
1026ebcd:      	testl	%eax, %eax
1026ebcf:      	je	0x1026ec0c
1026ebd1:      	pushl	%ebx
1026ebd2:      	pushl	%esi
1026ebd3:      	calll	0x10273e30
1026ebd8:      	testl	%eax, %eax
1026ebda:      	je	0x1026ec0c
1026ebdc:      	movl	0x5c(%esi), %eax
1026ebdf:      	movzwl	0x4c(%eax), %edx
1026ebe3:      	testl	%edx, %edx
1026ebe5:      	je	0x1026ec0c
1026ebe7:      	movl	0x48(%eax), %eax
1026ebea:      	addl	$0x4, %eax
1026ebed:      	nopl	(%eax)
1026ebf0:      	movzwl	-0x2(%eax), %ecx
1026ebf4:      	cmpl	$0x15, %ecx
1026ebf7:      	jne	0x1026ebfd
1026ebf9:      	addl	(%eax), %edi
1026ebfb:      	jmp	0x1026ec04
1026ebfd:      	cmpl	$0x16, %ecx
1026ec00:      	jne	0x1026ec04
1026ec02:      	addl	(%eax), %ebx
1026ec04:      	addl	$0x8, %eax
1026ec07:      	subl	$0x1, %edx
1026ec0a:      	jne	0x1026ebf0
1026ec0c:      	movl	0xc(%esp), %eax
1026ec10:      	pushl	$0x0
1026ec12:      	pushl	$0x15
1026ec14:      	pushl	%eax
1026ec15:      	calll	0x10273cb0
1026ec1a:      	pushl	$0x0
1026ec1c:      	pushl	$0x6f
1026ec1e:      	pushl	0x14(%esp)
1026ec22:      	movl	%eax, %esi
1026ec24:      	subl	%edi, %esi
1026ec26:      	calll	0x10273cb0
1026ec2b:      	pushl	$0x0
1026ec2d:      	pushl	$0x16
1026ec2f:      	pushl	0x14(%esp)
1026ec33:      	leal	(%esi,%eax), %edi
1026ec36:      	shll	$0x8, %edi
1026ec39:      	calll	0x10273cb0
1026ec3e:      	pushl	$0x0
1026ec40:      	movl	%eax, %esi
1026ec42:      	pushl	$0x6f
1026ec44:      	subl	%ebx, %esi
1026ec46:      	movl	0x14(%esp), %ebx
1026ec4a:      	pushl	%ebx
1026ec4b:      	calll	0x10273cb0
1026ec50:      	addl	0x2c(%esp), %edi
1026ec54:      	addl	%esi, %eax
1026ec56:      	addl	0x1c(%esp), %edi
1026ec5a:      	movl	0x14(%esp), %esi
1026ec5e:      	shll	$0x8, %eax
1026ec61:      	addl	0x30(%esp), %eax
1026ec65:      	addl	%eax, 0x10(%esp)
1026ec69:      	testl	%esi, %esi
1026ec6b:      	je	0x1026eca5
1026ec6d:      	pushl	%esi
1026ec6e:      	calll	0x10277b30
1026ec73:      	testl	%eax, %eax
1026ec75:      	je	0x1026ec85
1026ec77:      	pushl	$0x0
1026ec79:      	pushl	$0x7a
1026ec7b:      	pushl	%ebx
1026ec7c:      	calll	0x10273cb0
1026ec81:      	addl	%eax, 0x28(%esp)
1026ec85:      	pushl	%esi
1026ec86:      	calll	0x10277b60
1026ec8b:      	testl	%eax, %eax
1026ec8d:      	je	0x1026eca5
1026ec8f:      	pushl	$0x0
1026ec91:      	pushl	$0x79
1026ec93:      	pushl	%ebx
1026ec94:      	calll	0x10273cb0
1026ec99:      	movl	0x28(%esp), %ecx
1026ec9d:      	addl	%eax, %ecx
1026ec9f:      	movl	%ecx, 0x28(%esp)
1026eca3:      	jmp	0x1026eca9
1026eca5:      	movl	0x28(%esp), %ecx
1026eca9:      	movd	%ecx, %xmm2
1026ecad:      	movl	$0x64, %edx
1026ecb2:      	cvtdq2pd	%xmm2, %xmm2
1026ecb6:      	movl	%edi, %ecx
1026ecb8:      	calll	0x102ce840
1026ecbd:      	movl	0x10(%esp), %ecx
1026ecc1:      	movl	%eax, %edi
1026ecc3:      	calll	0x102ce840
1026ecc8:      	movl	%ebx, %ecx
1026ecca:      	movl	%eax, %esi
1026eccc:      	calll	0x102c5d10
1026ecd1:      	cmpl	%esi, %edi
1026ecd3:      	leal	0x1(%edi), %ecx
1026ecd6:      	pushl	$0x0
1026ecd8:      	cmovll	%esi, %ecx
1026ecdb:      	xorl	%edx, %edx
1026ecdd:      	subl	%edi, %ecx
1026ecdf:      	movl	0x24(%esp), %esi
1026ece3:      	divl	%ecx
1026ece5:      	pushl	%ebx
1026ece6:      	addl	%edi, %edx
1026ece8:      	pushl	%esi
1026ece9:      	movl	%edx, 0x8(%esi)
1026ecec:      	calll	0x1026f8c0
1026ecf1:      	movl	0x14(%esp), %eax
1026ecf5:      	pushl	$0x80
1026ecfa:      	pushl	$0x1
1026ecfc:      	pushl	%esi
1026ecfd:      	pushl	%eax
1026ecfe:      	pushl	%ebx
1026ecff:      	pushl	0x38(%esp)
1026ed03:      	calll	0x10286ad0
1026ed08:      	pushl	0x18(%ebp)
1026ed0b:      	pushl	%esi
1026ed0c:      	pushl	%ebx
1026ed0d:      	pushl	0x14(%ebp)
1026ed10:      	calll	0x102eda90
1026ed15:      	pushl	%esi
1026ed16:      	pushl	%ebx
1026ed17:      	calll	0x102ed0d0
1026ed1c:      	movl	0x34(%esp), %ecx
1026ed20:      	popl	%edi
1026ed21:      	popl	%esi
1026ed22:      	popl	%ebx
1026ed23:      	xorl	%esp, %ecx
1026ed25:      	calll	0x10301c0d
1026ed2a:      	movl	%ebp, %esp
1026ed2c:      	popl	%ebp
1026ed2d:      	retl	$0x18
; S13 burst
102fa2f0:      	pushl	%ebp
102fa2f1:      	movl	%esp, %ebp
102fa2f3:      	andl	$-0x8, %esp
102fa2f6:      	subl	$0xfc, %esp
102fa2fc:      	movl	0x1039800c, %eax
102fa301:      	xorl	%esp, %eax
102fa303:      	movl	%eax, 0xf8(%esp)
102fa30a:      	movl	0x8(%ebp), %eax
102fa30d:      	pushl	%ebx
102fa30e:      	pushl	%esi
102fa30f:      	movl	%ecx, %ebx
102fa311:      	movl	%eax, 0x8(%esp)
102fa315:      	movl	%ebx, 0x10(%esp)
102fa319:      	movl	%edx, %esi
102fa31b:      	movl	%esi, 0x18(%esp)
102fa31f:      	pushl	%edi
102fa320:      	testl	%ebx, %ebx
102fa322:      	je	0x102fa495
102fa328:      	testl	%esi, %esi
102fa32a:      	je	0x102fa495
102fa330:      	movl	%eax, %ecx
102fa332:      	calll	0x102ce5a0
102fa337:      	movl	%eax, 0x10(%esp)
102fa33b:      	testl	%eax, %eax
102fa33d:      	je	0x102fa495
102fa343:      	pushl	0x2c(%esi)
102fa346:      	calll	0x10275420
102fa34b:      	movl	%eax, %edi
102fa34d:      	movl	%edi, 0x18(%esp)
102fa351:      	testl	%edi, %edi
102fa353:      	je	0x102fa495
102fa359:      	cmpl	%esi, %edi
102fa35b:      	je	0x102fa495
102fa361:      	cmpl	$0x0, 0x2c(%edi)
102fa365:      	je	0x102fa495
102fa36b:      	pushl	%esi
102fa36c:      	pushl	%edi
102fa36d:      	calll	0x102ed090
102fa372:      	testl	%eax, %eax
102fa374:      	je	0x102fa495
102fa37a:      	pushl	%ebx
102fa37b:      	pushl	%esi
102fa37c:      	pushl	%eax
102fa37d:      	calll	0x102ed050
102fa382:      	pushl	%edi
102fa383:      	pushl	%esi
102fa384:      	pushl	%ebx
102fa385:      	calll	0x1027c8d0
102fa38a:      	pushl	%esi
102fa38b:      	calll	0x102ecd50
102fa390:      	testl	%eax, %eax
102fa392:      	jne	0x102fa495
102fa398:      	pushl	$0x70
102fa39a:      	pushl	%eax
102fa39b:      	leal	0x98(%esp), %eax
102fa3a2:      	pushl	%eax
102fa3a3:      	calll	0x10302d32
102fa3a8:      	movl	0xc(%ebp), %ebx
102fa3ab:      	leal	0x9c(%esp), %eax
102fa3b2:      	addl	$0xc, %esp
102fa3b5:      	pushl	%esi
102fa3b6:      	pushl	%ebx
102fa3b7:      	pushl	0x14(%esp)
102fa3bb:      	pushl	%edi
102fa3bc:      	pushl	%eax
102fa3bd:      	pushl	0x28(%esp)
102fa3c1:      	calll	0x1026ead0
102fa3c6:      	movl	0x10(%esp), %eax
102fa3ca:      	pushl	%ebx
102fa3cb:      	pushl	0x10(%esp)
102fa3cf:      	pushl	0x138(%eax)
102fa3d5:      	pushl	%esi
102fa3d6:      	calll	0x10276970
102fa3db:      	pushl	$0x0
102fa3dd:      	pushl	$0x149                  # imm = 0x149
102fa3e2:      	pushl	%esi
102fa3e3:      	movl	%eax, %edi
102fa3e5:      	calll	0x10273cb0
102fa3ea:      	pushl	$0x70
102fa3ec:      	movl	%eax, %esi
102fa3ee:      	leal	0x24(%esp), %eax
102fa3f2:      	pushl	$0x0
102fa3f4:      	pushl	%eax
102fa3f5:      	calll	0x10302d32
102fa3fa:      	movl	0xa4(%esp), %ecx
102fa401:      	addl	$0xc, %esp
102fa404:      	movd	%edi, %xmm2
102fa408:      	movl	$0x64, %edx
102fa40d:      	cvtdq2pd	%xmm2, %xmm2
102fa411:      	movd	%esi, %xmm0
102fa415:      	addsd	0x1037f830, %xmm2
102fa41d:      	cvtdq2pd	%xmm0, %xmm0
102fa421:      	addsd	%xmm0, %xmm2
102fa425:      	calll	0x102ce840
102fa42a:      	movl	%eax, 0x30(%esp)
102fa42e:      	movl	0x18(%esp), %eax
102fa432:      	pushl	%ebx
102fa433:      	pushl	0x10(%esp)
102fa437:      	movl	0x24(%esp), %ebx
102fa43b:      	movl	0x2c(%eax), %eax
102fa43e:      	movl	$0x1, 0x2c(%esp)
102fa446:      	movzwl	0x2(%eax), %edi
102fa44a:      	movzwl	0x6(%eax), %esi
102fa44e:      	movl	0x18(%esp), %eax
102fa452:      	pushl	0x64(%eax)
102fa455:      	pushl	%ebx
102fa456:      	calll	0x10276970
102fa45b:      	pushl	$0x0
102fa45d:      	leal	0x24(%esp), %ecx
102fa461:      	pushl	%ecx
102fa462:      	pushl	$0x1027b310             # imm = 0x1027B310
102fa467:      	pushl	$0x8583                 # imm = 0x8583
102fa46c:      	pushl	%eax
102fa46d:      	pushl	%esi
102fa46e:      	pushl	%edi
102fa46f:      	pushl	%ebx
102fa470:      	pushl	0x34(%esp)
102fa474:      	calll	0x102ec960
102fa479:      	movl	$0x1, %eax
102fa47e:      	popl	%edi
102fa47f:      	popl	%esi
102fa480:      	popl	%ebx
102fa481:      	movl	0xf8(%esp), %ecx
102fa488:      	xorl	%esp, %ecx
102fa48a:      	calll	0x10301c0d
102fa48f:      	movl	%ebp, %esp
102fa491:      	popl	%ebp
102fa492:      	retl	$0x8
102fa495:      	movl	0x104(%esp), %ecx
102fa49c:      	xorl	%eax, %eax
102fa49e:      	popl	%edi
102fa49f:      	popl	%esi
102fa4a0:      	popl	%ebx
102fa4a1:      	xorl	%esp, %ecx
102fa4a3:      	calll	0x10301c0d
102fa4a8:      	movl	%ebp, %esp
102fa4aa:      	popl	%ebp
102fa4ab:      	retl	$0x8
; S13 strikes
10270d20:      	pushl	%ebp
10270d21:      	movl	%esp, %ebp
10270d23:      	pushl	%ebx
10270d24:      	movl	%edx, %ebx
10270d26:      	pushl	%esi
10270d27:      	pushl	%edi
10270d28:      	testl	%ecx, %ecx
10270d2a:      	je	0x10270d5a
10270d2c:      	pushl	$0x2
10270d2e:      	pushl	0x8(%ebp)
10270d31:      	pushl	%ecx
10270d32:      	pushl	%ebx
10270d33:      	calll	0x102727d0
10270d38:      	pushl	$0x0
10270d3a:      	pushl	$0x151                  # imm = 0x151
10270d3f:      	pushl	%ebx
10270d40:      	movl	%eax, %edi
10270d42:      	calll	0x10273cb0
10270d47:      	pushl	$0x0
10270d49:      	pushl	$0x102                  # imm = 0x102
10270d4e:      	pushl	%ebx
10270d4f:      	movl	%eax, %esi
10270d51:      	calll	0x10273cb0
10270d56:      	addl	%edi, %eax
10270d58:      	jmp	0x10270d76
10270d5a:      	pushl	$0x0
10270d5c:      	pushl	$0x151                  # imm = 0x151
10270d61:      	pushl	%ebx
10270d62:      	calll	0x10273cb0
10270d67:      	pushl	$0x0
10270d69:      	pushl	$0x102                  # imm = 0x102
10270d6e:      	pushl	%ebx
10270d6f:      	movl	%eax, %esi
10270d71:      	calll	0x10273cb0
10270d76:      	addl	%eax, %esi
10270d78:      	testl	%esi, %esi
10270d7a:      	jle	0x10270da3
10270d7c:      	movl	$0x4b, %eax
10270d81:      	cmpl	%eax, %esi
10270d83:      	pushl	$0x64
10270d85:      	cmovgl	%eax, %esi
10270d88:      	leal	0x20(%ebx), %eax
10270d8b:      	pushl	$0x0
10270d8d:      	pushl	%eax
10270d8e:      	calll	0x102ed910
10270d93:      	cmpl	%eax, %esi
10270d95:      	jle	0x10270da3
10270d97:      	movl	$0x1, %eax
10270d9c:      	popl	%edi
10270d9d:      	popl	%esi
10270d9e:      	popl	%ebx
10270d9f:      	popl	%ebp
10270da0:      	retl	$0x4
10270da3:      	pushl	$0x0
10270da5:      	pushl	$0xd2
10270daa:      	pushl	%ebx
10270dab:      	calll	0x10273cb0
10270db0:      	pushl	$0x0
10270db2:      	pushl	$0x8d
10270db7:      	pushl	%ebx
10270db8:      	leal	0x4b(%eax), %edi
10270dbb:      	calll	0x10273cb0
10270dc0:      	movl	%eax, %esi
10270dc2:      	testl	%esi, %esi
10270dc4:      	jle	0x10270de8
10270dc6:      	pushl	$0x64
10270dc8:      	pushl	$0x0
10270dca:      	leal	0x20(%ebx), %eax
10270dcd:      	cmpl	%edi, %esi
10270dcf:      	pushl	%eax
10270dd0:      	cmovgl	%edi, %esi
10270dd3:      	calll	0x102ed910
10270dd8:      	cmpl	%eax, %esi
10270dda:      	jle	0x10270de8
10270ddc:      	movl	$0x2, %eax
10270de1:      	popl	%edi
10270de2:      	popl	%esi
10270de3:      	popl	%ebx
10270de4:      	popl	%ebp
10270de5:      	retl	$0x4
10270de8:      	popl	%edi
10270de9:      	popl	%esi
10270dea:      	xorl	%eax, %eax
10270dec:      	popl	%ebx
10270ded:      	popl	%ebp
10270dee:      	retl	$0x4
10270df1:      	int3
10270df2:      	int3
10270df3:      	int3
10270df4:      	int3
10270df5:      	int3
10270df6:      	int3
10270df7:      	int3
10270df8:      	int3
10270df9:      	int3
10270dfa:      	int3
10270dfb:      	int3
10270dfc:      	int3
10270dfd:      	int3
10270dfe:      	int3
10270dff:      	int3
10270e00:      	pushl	%ebp
10270e01:      	movl	%esp, %ebp
10270e03:      	andl	$-0x8, %esp
10270e06:      	pushl	%ecx
10270e07:      	pushl	%ebx
10270e08:      	pushl	%esi
10270e09:      	pushl	%edi
10270e0a:      	movl	%ecx, %edi
10270e0c:      	movl	%edx, %ebx
10270e0e:      	testl	%edi, %edi
10270e10:      	je	0x10270e98
10270e16:      	testl	%ebx, %ebx
10270e18:      	je	0x10270e98
10270e1a:      	pushl	%edi
10270e1b:      	calll	0x1029a300
10270e20:      	pushl	0x8(%ebp)
10270e23:      	movl	%edi, %edx
10270e25:      	movl	%eax, %ecx
10270e27:      	calll	0x10270d20
10270e2c:      	subl	$0x1, %eax
10270e2f:      	je	0x10270e57
10270e31:      	subl	$0x1, %eax
10270e34:      	jne	0x10270e98
10270e36:      	pushl	%eax
10270e37:      	pushl	$0x101                  # imm = 0x101
10270e3c:      	pushl	%edi
10270e3d:      	calll	0x10273dd0
10270e42:      	movl	$0x101, %edx            # imm = 0x101
10270e47:      	movl	%edi, %ecx
10270e49:      	movl	%eax, %esi
10270e4b:      	calll	0x102d30b0
10270e50:      	addl	$0x96, %eax
10270e55:      	jmp	0x10270e77
10270e57:      	pushl	$0x0
10270e59:      	pushl	$0x100                  # imm = 0x100
10270e5e:      	pushl	%edi
10270e5f:      	calll	0x10273dd0
10270e64:      	movl	$0x100, %edx            # imm = 0x100
10270e69:      	movl	%edi, %ecx
10270e6b:      	movl	%eax, %esi
10270e6d:      	calll	0x102d30b0
10270e72:      	addl	$0xc8, %eax
10270e77:      	orl	$0x2000, 0x4(%ebx)      # imm = 0x2000
10270e7e:      	addl	%esi, %eax
10270e80:      	movl	0x8(%ebx), %ecx
10270e83:      	movl	$0x64, %edx
10270e88:      	movd	%eax, %xmm2
10270e8c:      	cvtdq2pd	%xmm2, %xmm2
10270e90:      	calll	0x102ce840
10270e95:      	movl	%eax, 0x8(%ebx)
10270e98:      	popl	%edi
10270e99:      	popl	%esi
10270e9a:      	popl	%ebx
10270e9b:      	movl	%ebp, %esp
10270e9d:      	popl	%ebp
10270e9e:      	retl	$0x4
; S14 burst
103aacf0:      	pushl	%ebp
103aacf1:      	movl	%esp, %ebp
103aacf3:      	andl	$-0x8, %esp
103aacf6:      	subl	$0xfc, %esp
103aacfc:      	movl	0x1046400c, %eax
103aad01:      	xorl	%esp, %eax
103aad03:      	movl	%eax, 0xf8(%esp)
103aad0a:      	movl	0x8(%ebp), %eax
103aad0d:      	pushl	%ebx
103aad0e:      	pushl	%esi
103aad0f:      	movl	%ecx, %ebx
103aad11:      	movl	%eax, 0x8(%esp)
103aad15:      	movl	%ebx, 0x10(%esp)
103aad19:      	movl	%edx, %esi
103aad1b:      	movl	%esi, 0x18(%esp)
103aad1f:      	pushl	%edi
103aad20:      	testl	%ebx, %ebx
103aad22:      	je	0x103aae95
103aad28:      	testl	%esi, %esi
103aad2a:      	je	0x103aae95
103aad30:      	movl	%eax, %ecx
103aad32:      	calll	0x103780f0
103aad37:      	movl	%eax, 0x10(%esp)
103aad3b:      	testl	%eax, %eax
103aad3d:      	je	0x103aae95
103aad43:      	pushl	0x2c(%esi)
103aad46:      	calll	0x103079e0
103aad4b:      	movl	%eax, %edi
103aad4d:      	movl	%edi, 0x18(%esp)
103aad51:      	testl	%edi, %edi
103aad53:      	je	0x103aae95
103aad59:      	cmpl	%esi, %edi
103aad5b:      	je	0x103aae95
103aad61:      	cmpl	$0x0, 0x2c(%edi)
103aad65:      	je	0x103aae95
103aad6b:      	pushl	%esi
103aad6c:      	pushl	%edi
103aad6d:      	calll	0x1039d4a0
103aad72:      	testl	%eax, %eax
103aad74:      	je	0x103aae95
103aad7a:      	pushl	%ebx
103aad7b:      	pushl	%esi
103aad7c:      	pushl	%eax
103aad7d:      	calll	0x1039d460
103aad82:      	pushl	%edi
103aad83:      	pushl	%esi
103aad84:      	pushl	%ebx
103aad85:      	calll	0x1030f180
103aad8a:      	pushl	%esi
103aad8b:      	calll	0x1039d1a0
103aad90:      	testl	%eax, %eax
103aad92:      	jne	0x103aae95
103aad98:      	pushl	$0x70
103aad9a:      	pushl	%eax
103aad9b:      	leal	0x98(%esp), %eax
103aada2:      	pushl	%eax
103aada3:      	calll	0x103b3d4c
103aada8:      	movl	0xc(%ebp), %ebx
103aadab:      	leal	0x9c(%esp), %eax
103aadb2:      	addl	$0xc, %esp
103aadb5:      	pushl	%esi
103aadb6:      	pushl	%ebx
103aadb7:      	pushl	0x14(%esp)
103aadbb:      	pushl	%edi
103aadbc:      	pushl	%eax
103aadbd:      	pushl	0x28(%esp)
103aadc1:      	calll	0x10300760
103aadc6:      	movl	0x10(%esp), %eax
103aadca:      	pushl	%ebx
103aadcb:      	pushl	0x10(%esp)
103aadcf:      	pushl	0x138(%eax)
103aadd5:      	pushl	%esi
103aadd6:      	calll	0x103090a0
103aaddb:      	pushl	$0x0
103aaddd:      	pushl	$0x149                  # imm = 0x149
103aade2:      	pushl	%esi
103aade3:      	movl	%eax, %edi
103aade5:      	calll	0x10306150
103aadea:      	pushl	$0x70
103aadec:      	movl	%eax, %esi
103aadee:      	leal	0x24(%esp), %eax
103aadf2:      	pushl	$0x0
103aadf4:      	pushl	%eax
103aadf5:      	calll	0x103b3d4c
103aadfa:      	movl	0xa4(%esp), %ecx
103aae01:      	addl	$0xc, %esp
103aae04:      	movd	%edi, %xmm2
103aae08:      	movl	$0x64, %edx
103aae0d:      	cvtdq2pd	%xmm2, %xmm2
103aae11:      	movd	%esi, %xmm0
103aae15:      	addsd	0x1044aa70, %xmm2
103aae1d:      	cvtdq2pd	%xmm0, %xmm0
103aae21:      	addsd	%xmm0, %xmm2
103aae25:      	calll	0x103784a0
103aae2a:      	movl	%eax, 0x30(%esp)
103aae2e:      	movl	0x18(%esp), %eax
103aae32:      	pushl	%ebx
103aae33:      	pushl	0x10(%esp)
103aae37:      	movl	0x24(%esp), %ebx
103aae3b:      	movl	0x2c(%eax), %eax
103aae3e:      	movl	$0x1, 0x2c(%esp)
103aae46:      	movzwl	0x2(%eax), %edi
103aae4a:      	movzwl	0x6(%eax), %esi
103aae4e:      	movl	0x18(%esp), %eax
103aae52:      	pushl	0x64(%eax)
103aae55:      	pushl	%ebx
103aae56:      	calll	0x103090a0
103aae5b:      	pushl	$0x0
103aae5d:      	leal	0x24(%esp), %ecx
103aae61:      	pushl	%ecx
103aae62:      	pushl	$0x1030dbc0             # imm = 0x1030DBC0
103aae67:      	pushl	$0x8583                 # imm = 0x8583
103aae6c:      	pushl	%eax
103aae6d:      	pushl	%esi
103aae6e:      	pushl	%edi
103aae6f:      	pushl	%ebx
103aae70:      	pushl	0x34(%esp)
103aae74:      	calll	0x1039cdb0
103aae79:      	movl	$0x1, %eax
103aae7e:      	popl	%edi
103aae7f:      	popl	%esi
103aae80:      	popl	%ebx
103aae81:      	movl	0xf8(%esp), %ecx
103aae88:      	xorl	%esp, %ecx
103aae8a:      	calll	0x103b2bcf
103aae8f:      	movl	%ebp, %esp
103aae91:      	popl	%ebp
103aae92:      	retl	$0x8
103aae95:      	movl	0x104(%esp), %ecx
103aae9c:      	xorl	%eax, %eax
103aae9e:      	popl	%edi
103aae9f:      	popl	%esi
103aaea0:      	popl	%ebx
103aaea1:      	xorl	%esp, %ecx
103aaea3:      	calll	0x103b2bcf
103aaea8:      	movl	%ebp, %esp
103aaeaa:      	popl	%ebp
103aaeab:      	retl	$0x8
; S14 kick builder
10300760:      	pushl	%ebp
10300761:      	movl	%esp, %ebp
10300763:      	andl	$-0x8, %esp
10300766:      	subl	$0x2c, %esp
10300769:      	movl	0x1046400c, %eax
1030076e:      	xorl	%esp, %eax
10300770:      	movl	%eax, 0x28(%esp)
10300774:      	movl	0x8(%ebp), %eax
10300777:      	pushl	%ebx
10300778:      	movl	0x1c(%ebp), %ebx
1030077b:      	pushl	%esi
1030077c:      	movl	0xc(%ebp), %esi
1030077f:      	pushl	%edi
10300780:      	pushl	%esi
10300781:      	movl	%eax, 0x28(%esp)
10300785:      	movl	0x10(%ebp), %eax
10300788:      	pushl	%ebx
10300789:      	movl	%esi, 0x28(%esp)
1030078d:      	movl	%eax, 0x1c(%esp)
10300791:      	movl	%ebx, 0x14(%esp)
10300795:      	calll	0x1039d4c0
1030079a:      	orl	$0x3, (%esi)
1030079d:      	pushl	$0x0
1030079f:      	pushl	$0x0
103007a1:      	pushl	%ebx
103007a2:      	calll	0x10306150
103007a7:      	pushl	$0x0
103007a9:      	pushl	$0x2
103007ab:      	pushl	%ebx
103007ac:      	calll	0x10306150
103007b1:      	movl	%eax, %ecx
103007b3:      	movl	$0x0, 0x2c(%esp)
103007bb:      	shll	$0x8, %ecx
103007be:      	movl	%ecx, %eax
103007c0:      	movl	$0x0, 0x30(%esp)
103007c8:      	cltd
103007c9:      	andl	$0x3, %edx
103007cc:      	addl	%edx, %eax
103007ce:      	sarl	$0x2, %eax
103007d1:      	movl	%eax, 0x1c(%esp)
103007d5:      	movl	$0x55555556, %eax       # imm = 0x55555556
103007da:      	imull	%ecx
103007dc:      	movl	%edx, %eax
103007de:      	shrl	$0x1f, %eax
103007e1:      	addl	%edx, %eax
103007e3:      	movl	%eax, 0x10(%esp)
103007e7:      	movl	0xc(%esi), %eax
103007ea:      	movl	%eax, 0x28(%esp)
103007ee:      	leal	0x28(%esp), %eax
103007f2:      	pushl	%eax
103007f3:      	leal	0x34(%esp), %eax
103007f7:      	pushl	%eax
103007f8:      	leal	0x34(%esp), %eax
103007fc:      	pushl	%eax
103007fd:      	pushl	%ebx
103007fe:      	calll	0x10309610
10300803:      	movl	0xc(%esp), %eax
10300807:      	xorl	%edi, %edi
10300809:      	addl	$0x64, 0x28(%esp)
1030080e:      	xorl	%ebx, %ebx
10300810:      	shll	$0x8, 0x2c(%esp)
10300815:      	shll	$0x8, 0x30(%esp)
1030081a:      	movl	0x60(%eax), %ecx
1030081d:      	movl	%ecx, 0x18(%esp)
10300821:      	testl	%ecx, %ecx
10300823:      	je	0x103008a0
10300825:      	pushl	%ecx
10300826:      	calll	0x10309de0
1030082b:      	movl	%eax, %esi
1030082d:      	testl	%esi, %esi
1030082f:      	je	0x1030089c
10300831:      	pushl	%esi
10300832:      	calll	0x10309e40
10300837:      	xorl	%ecx, %ecx
10300839:      	cmpb	$0x4, %al
1030083b:      	sete	%cl
1030083e:      	addl	$0x4, %ecx
10300841:      	pushl	%ecx
10300842:      	pushl	0x1c(%esp)
10300846:      	calll	0x10308140
1030084b:      	pushl	$0x2d
1030084d:      	pushl	%esi
1030084e:      	calll	0x10307f90
10300853:      	testl	%eax, %eax
10300855:      	je	0x1030089c
10300857:      	pushl	%esi
10300858:      	calll	0x10306450
1030085d:      	testl	%eax, %eax
1030085f:      	je	0x1030089c
10300861:      	pushl	%ebx
10300862:      	pushl	%esi
10300863:      	calll	0x103062d0
10300868:      	testl	%eax, %eax
1030086a:      	je	0x1030089c
1030086c:      	movl	0x5c(%esi), %eax
1030086f:      	movzwl	0x4c(%eax), %edx
10300873:      	testl	%edx, %edx
10300875:      	je	0x1030089c
10300877:      	movl	0x48(%eax), %eax
1030087a:      	addl	$0x4, %eax
1030087d:      	nopl	(%eax)
10300880:      	movzwl	-0x2(%eax), %ecx
10300884:      	cmpl	$0x15, %ecx
10300887:      	jne	0x1030088d
10300889:      	addl	(%eax), %edi
1030088b:      	jmp	0x10300894
1030088d:      	cmpl	$0x16, %ecx
10300890:      	jne	0x10300894
10300892:      	addl	(%eax), %ebx
10300894:      	addl	$0x8, %eax
10300897:      	subl	$0x1, %edx
1030089a:      	jne	0x10300880
1030089c:      	movl	0xc(%esp), %eax
103008a0:      	pushl	$0x0
103008a2:      	pushl	$0x15
103008a4:      	pushl	%eax
103008a5:      	calll	0x10306150
103008aa:      	pushl	$0x0
103008ac:      	pushl	$0x6f
103008ae:      	pushl	0x14(%esp)
103008b2:      	movl	%eax, %esi
103008b4:      	subl	%edi, %esi
103008b6:      	calll	0x10306150
103008bb:      	pushl	$0x0
103008bd:      	pushl	$0x16
103008bf:      	pushl	0x14(%esp)
103008c3:      	leal	(%esi,%eax), %edi
103008c6:      	shll	$0x8, %edi
103008c9:      	calll	0x10306150
103008ce:      	pushl	$0x0
103008d0:      	movl	%eax, %esi
103008d2:      	pushl	$0x6f
103008d4:      	subl	%ebx, %esi
103008d6:      	movl	0x14(%esp), %ebx
103008da:      	pushl	%ebx
103008db:      	calll	0x10306150
103008e0:      	addl	0x2c(%esp), %edi
103008e4:      	addl	%esi, %eax
103008e6:      	addl	0x1c(%esp), %edi
103008ea:      	movl	0x14(%esp), %esi
103008ee:      	shll	$0x8, %eax
103008f1:      	addl	0x30(%esp), %eax
103008f5:      	addl	%eax, 0x10(%esp)
103008f9:      	testl	%esi, %esi
103008fb:      	je	0x10300935
103008fd:      	pushl	%esi
103008fe:      	calll	0x1030a2f0
10300903:      	testl	%eax, %eax
10300905:      	je	0x10300915
10300907:      	pushl	$0x0
10300909:      	pushl	$0x7a
1030090b:      	pushl	%ebx
1030090c:      	calll	0x10306150
10300911:      	addl	%eax, 0x28(%esp)
10300915:      	pushl	%esi
10300916:      	calll	0x1030a320
1030091b:      	testl	%eax, %eax
1030091d:      	je	0x10300935
1030091f:      	pushl	$0x0
10300921:      	pushl	$0x79
10300923:      	pushl	%ebx
10300924:      	calll	0x10306150
10300929:      	movl	0x28(%esp), %ecx
1030092d:      	addl	%eax, %ecx
1030092f:      	movl	%ecx, 0x28(%esp)
10300933:      	jmp	0x10300939
10300935:      	movl	0x28(%esp), %ecx
10300939:      	movd	%ecx, %xmm2
1030093d:      	movl	$0x64, %edx
10300942:      	cvtdq2pd	%xmm2, %xmm2
10300946:      	movl	%edi, %ecx
10300948:      	calll	0x103784a0
1030094d:      	movl	0x10(%esp), %ecx
10300951:      	movl	%eax, %edi
10300953:      	calll	0x103784a0
10300958:      	movl	%ebx, %ecx
1030095a:      	movl	%eax, %esi
1030095c:      	calll	0x1036baa0
10300961:      	cmpl	%esi, %edi
10300963:      	leal	0x1(%edi), %ecx
10300966:      	pushl	$0x0
10300968:      	cmovll	%esi, %ecx
1030096b:      	xorl	%edx, %edx
1030096d:      	subl	%edi, %ecx
1030096f:      	movl	0x24(%esp), %esi
10300973:      	divl	%ecx
10300975:      	pushl	%ebx
10300976:      	addl	%edi, %edx
10300978:      	pushl	%esi
10300979:      	movl	%edx, 0x8(%esi)
1030097c:      	calll	0x10301460
10300981:      	movl	0x14(%esp), %eax
10300985:      	pushl	$0x80
1030098a:      	pushl	$0x1
1030098c:      	pushl	%esi
1030098d:      	pushl	%eax
1030098e:      	pushl	%ebx
1030098f:      	pushl	0x38(%esp)
10300993:      	calll	0x103197d0
10300998:      	pushl	0x18(%ebp)
1030099b:      	pushl	%esi
1030099c:      	pushl	%ebx
1030099d:      	pushl	0x14(%ebp)
103009a0:      	calll	0x1039de90
103009a5:      	pushl	%esi
103009a6:      	pushl	%ebx
103009a7:      	calll	0x1039d4e0
103009ac:      	movl	0x34(%esp), %ecx
103009b0:      	popl	%edi
103009b1:      	popl	%esi
103009b2:      	popl	%ebx
103009b3:      	xorl	%esp, %ecx
103009b5:      	calll	0x103b2bcf
103009ba:      	movl	%ebp, %esp
103009bc:      	popl	%ebp
103009bd:      	retl	$0x18

; S14 strike caps and multiplier
10302a10:      	pushl	%ebp
10302a11:      	movl	%esp, %ebp
10302a13:      	pushl	%ebx
10302a14:      	movl	%edx, %ebx
10302a16:      	pushl	%esi
10302a17:      	pushl	%edi
10302a18:      	testl	%ecx, %ecx
10302a1a:      	je	0x10302a4a
10302a1c:      	pushl	$0x2
10302a1e:      	pushl	0x8(%ebp)
10302a21:      	pushl	%ecx
10302a22:      	pushl	%ebx
10302a23:      	calll	0x103048d0
10302a28:      	pushl	$0x0
10302a2a:      	pushl	$0x151                  # imm = 0x151
10302a2f:      	pushl	%ebx
10302a30:      	movl	%eax, %edi
10302a32:      	calll	0x10306150
10302a37:      	pushl	$0x0
10302a39:      	pushl	$0x102                  # imm = 0x102
10302a3e:      	pushl	%ebx
10302a3f:      	movl	%eax, %esi
10302a41:      	calll	0x10306150
10302a46:      	addl	%edi, %eax
10302a48:      	jmp	0x10302a66
10302a4a:      	pushl	$0x0
10302a4c:      	pushl	$0x151                  # imm = 0x151
10302a51:      	pushl	%ebx
10302a52:      	calll	0x10306150
10302a57:      	pushl	$0x0
10302a59:      	pushl	$0x102                  # imm = 0x102
10302a5e:      	pushl	%ebx
10302a5f:      	movl	%eax, %esi
10302a61:      	calll	0x10306150
10302a66:      	addl	%eax, %esi
10302a68:      	testl	%esi, %esi
10302a6a:      	jle	0x10302a93
10302a6c:      	movl	$0x4b, %eax
10302a71:      	cmpl	%eax, %esi
10302a73:      	pushl	$0x64
10302a75:      	cmovgl	%eax, %esi
10302a78:      	leal	0x20(%ebx), %eax
10302a7b:      	pushl	$0x0
10302a7d:      	pushl	%eax
10302a7e:      	calll	0x1039dd10
10302a83:      	cmpl	%eax, %esi
10302a85:      	jle	0x10302a93
10302a87:      	movl	$0x1, %eax
10302a8c:      	popl	%edi
10302a8d:      	popl	%esi
10302a8e:      	popl	%ebx
10302a8f:      	popl	%ebp
10302a90:      	retl	$0x4
10302a93:      	pushl	$0x0
10302a95:      	pushl	$0xd2
10302a9a:      	pushl	%ebx
10302a9b:      	calll	0x10306150
10302aa0:      	pushl	$0x0
10302aa2:      	pushl	$0x8d
10302aa7:      	pushl	%ebx
10302aa8:      	leal	0x4b(%eax), %edi
10302aab:      	calll	0x10306150
10302ab0:      	movl	%eax, %esi
10302ab2:      	testl	%esi, %esi
10302ab4:      	jle	0x10302ad8
10302ab6:      	pushl	$0x64
10302ab8:      	pushl	$0x0
10302aba:      	leal	0x20(%ebx), %eax
10302abd:      	cmpl	%edi, %esi
10302abf:      	pushl	%eax
10302ac0:      	cmovgl	%edi, %esi
10302ac3:      	calll	0x1039dd10
10302ac8:      	cmpl	%eax, %esi
10302aca:      	jle	0x10302ad8
10302acc:      	movl	$0x2, %eax
10302ad1:      	popl	%edi
10302ad2:      	popl	%esi
10302ad3:      	popl	%ebx
10302ad4:      	popl	%ebp
10302ad5:      	retl	$0x4
10302ad8:      	popl	%edi
10302ad9:      	popl	%esi
10302ada:      	xorl	%eax, %eax
10302adc:      	popl	%ebx
10302add:      	popl	%ebp
10302ade:      	retl	$0x4
10302ae1:      	int3
10302ae2:      	int3
10302ae3:      	int3
10302ae4:      	int3
10302ae5:      	int3
10302ae6:      	int3
10302ae7:      	int3
10302ae8:      	int3
10302ae9:      	int3
10302aea:      	int3
10302aeb:      	int3
10302aec:      	int3
10302aed:      	int3
10302aee:      	int3
10302aef:      	int3
10302af0:      	pushl	%ebp
10302af1:      	movl	%esp, %ebp
10302af3:      	andl	$-0x8, %esp
10302af6:      	pushl	%ecx
10302af7:      	pushl	%ebx
10302af8:      	pushl	%esi
10302af9:      	pushl	%edi
10302afa:      	movl	%ecx, %edi
10302afc:      	movl	%edx, %ebx
10302afe:      	testl	%edi, %edi
10302b00:      	je	0x10302b88
10302b06:      	testl	%ebx, %ebx
10302b08:      	je	0x10302b88
10302b0a:      	pushl	%edi
10302b0b:      	calll	0x1032ead0
10302b10:      	pushl	0x8(%ebp)
10302b13:      	movl	%edi, %edx
10302b15:      	movl	%eax, %ecx
10302b17:      	calll	0x10302a10
10302b1c:      	subl	$0x1, %eax
10302b1f:      	je	0x10302b47
10302b21:      	subl	$0x1, %eax
10302b24:      	jne	0x10302b88
10302b26:      	pushl	%eax
10302b27:      	pushl	$0x101                  # imm = 0x101
10302b2c:      	pushl	%edi
10302b2d:      	calll	0x10306270
10302b32:      	movl	$0x101, %edx            # imm = 0x101
10302b37:      	movl	%edi, %ecx
10302b39:      	movl	%eax, %esi
10302b3b:      	calll	0x1037d450
10302b40:      	addl	$0x96, %eax
10302b45:      	jmp	0x10302b67
10302b47:      	pushl	$0x0
10302b49:      	pushl	$0x100                  # imm = 0x100
10302b4e:      	pushl	%edi
10302b4f:      	calll	0x10306270
10302b54:      	movl	$0x100, %edx            # imm = 0x100
10302b59:      	movl	%edi, %ecx
10302b5b:      	movl	%eax, %esi
10302b5d:      	calll	0x1037d450
10302b62:      	addl	$0xc8, %eax
10302b67:      	orl	$0x2000, 0x4(%ebx)      # imm = 0x2000
10302b6e:      	addl	%esi, %eax
10302b70:      	movl	0x8(%ebx), %ecx
10302b73:      	movl	$0x64, %edx
10302b78:      	movd	%eax, %xmm2
10302b7c:      	cvtdq2pd	%xmm2, %xmm2
10302b80:      	calll	0x103784a0
10302b85:      	movl	%eax, 0x8(%ebx)
10302b88:      	popl	%edi
10302b89:      	popl	%esi
10302b8a:      	popl	%ebx
10302b8b:      	movl	%ebp, %esp
10302b8d:      	popl	%ebp
10302b8e:      	retl	$0x4
